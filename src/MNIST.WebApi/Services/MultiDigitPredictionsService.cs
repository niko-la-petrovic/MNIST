using Microsoft.Extensions.Configuration;
using MNIST.WebApi.ML.Model;
using MNIST.WebApi.ML.Model.Interfaces;
using MNIST.WebApi.Services.Interfaces;
using OpenCvSharp;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MNIST.WebApi.Services
{
    public class MultiDigitPredictionsService : PredictionsService, IMultiDigitPredictionsService
    {
        public MultiDigitPredictionsService(
            IConfiguration configuration,
            IOnnxModelScorer onnxModelScorer)
            : base(configuration, onnxModelScorer)
        {
        }

        public override async Task<IEnumerable<Prediction>> GetPredictionsAsync(PredictionInput predictionInput)
        {
            // TODO include original file name in prediction for front end
            ConcurrentDictionary<string, string> uploadedFiles = await UploadFiles(predictionInput);

            List<InputImageData> initialImages = PrepareInputImageData(predictionInput, uploadedFiles);

            var segmentedImagesDict = SegmentImages(initialImages);

            List<Prediction> outPredictions = segmentedImagesDict.Select(inputPair =>
            {
                List<Prediction> inputPredictions = Predict(inputPair.Value);
                Prediction outPrediction = new Prediction
                {
                    InputImage = inputPair.Key.ImagePath,
                    Label = inputPair.Key.Label,
                    LabelProbabilityPairs = new(),
                    LabelScorePairs = new()
                };

                var labels = new List<string>();
                var scores = new List<double>();
                for (int i = 0; i < inputPredictions.Count; i++)
                {
                    var inputPrediction = inputPredictions[i];
                    if (!labels.Any())
                    {
                        labels = inputPrediction.LabelScorePairs.Keys.ToList();
                        scores = inputPrediction.LabelScorePairs.Values.ToList();
                        continue;
                    }

                    var newLabels = new List<string>();
                    var newScores = new List<double>();
                    for (int j = 0; j < labels.Count; j++)
                    {
                        string existingLabel = labels[j];
                        double existingScore = scores[j];
                        foreach (var pair in inputPrediction.LabelScorePairs)
                        {
                            newLabels.Add(existingLabel + pair.Key);
                            newScores.Add(existingScore + pair.Value);
                        }
                    }
                    labels = newLabels;
                    scores = newScores;
                }

                // TODO maybe apply softmax individually before calculating probabilities?

                outPrediction.LabelScorePairs = new Dictionary<string, double>(labels.Zip(scores)
                        .Select(z => new KeyValuePair<string, double>(z.First, z.Second)));
                OnnxModelScorer.ParseScores(outPrediction);

                return outPrediction;
            }).ToList();


            return outPredictions;
        }

        protected virtual Dictionary<InputImageData, IEnumerable<InputImageData>> SegmentImages(List<InputImageData> inputImageData)
        {
            var kvpList = inputImageData.Select(inputImage =>
            {
                using var uploadedImage = new Mat(inputImage.ImagePath);
                using var convertedImage = uploadedImage.CvtColor(ColorConversionCodes.BGR2GRAY);
                using (var thresholdedImage = convertedImage.Threshold(byte.MaxValue - 100, byte.MaxValue, ThresholdTypes.Binary))
                {
                    var size = thresholdedImage.Size();

                    var pointContours = thresholdedImage.FindContoursAsArray(RetrievalModes.External,
                        ContourApproximationModes.ApproxSimple).Select(p => p.ToList()).ToList();

                    var segmentedInputImageData = pointContours.Select(pointContour =>
                    {
                        // TODO take the area of the entire image and the area of each bounding rect;
                        // if the area of the bounded rect is less than 20%, ignore that contour
                        // return null and perform Where != null after
                        Rect rect = Cv2.MinAreaRect(pointContour).BoundingRect();
                        Rect extendedRect = rect;
                        {
                            int greaterDimension = 0;
                            double difference = Math.Abs(rect.Height - rect.Width);
                            if (rect.Height > rect.Width)
                            {
                                greaterDimension = rect.Height;
                                extendedRect.Left = Math.Max(0, (int)Math.Abs(rect.Left - difference / 2.0));
                                double tempRight = Math.Min(size.Width, (int)(rect.Right + difference / 2.0));
                                extendedRect.Width = (int)(tempRight - extendedRect.Left);
                            }
                            else
                            {
                                greaterDimension = rect.Width;
                                extendedRect.Top = Math.Max(0, (int)Math.Abs(rect.Top - difference / 2.0));
                                double tempBottom = Math.Min(size.Height, (int)(rect.Bottom + difference / 2.0));
                                extendedRect.Height = (int)(tempBottom - extendedRect.Top);
                            }

                            int fraction = (int)(greaterDimension * 0.15);

                            int top = Math.Max(0, Math.Abs(extendedRect.Top - fraction));
                            int left = Math.Max(0, Math.Abs(extendedRect.Left - fraction));
                            int right = Math.Min(size.Width, extendedRect.Right + fraction);
                            int bottom = Math.Min(size.Height, extendedRect.Bottom + fraction);
                            extendedRect = new Rect(left, top, right - left, bottom - top);
                        }

                        using var imageSegment = thresholdedImage[extendedRect];
                        string copyToPath = CopyToPath(Path.GetExtension(inputImage.ImagePath));
                        imageSegment.SaveImage(copyToPath);

                        return new
                        {
                            InputImageData = new InputImageData
                            {
                                ImagePath = copyToPath,
                                Label = inputImage.Label
                            },
                            MinXCoord = pointContour.First().X
                        };
                    }).OrderBy(a => a.MinXCoord).ToList();

                    var keyValuePair = new KeyValuePair<InputImageData, IEnumerable<InputImageData>>
                    (
                        inputImage,
                        segmentedInputImageData.Select(a => a.InputImageData)
                    );

                    return keyValuePair;
                }
            }).ToList();

            return new Dictionary<InputImageData, IEnumerable<InputImageData>>(kvpList);
        }

    }
}
