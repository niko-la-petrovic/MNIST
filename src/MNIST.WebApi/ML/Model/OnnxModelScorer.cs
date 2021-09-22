using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.ML;
using Microsoft.ML.Data;
using MNIST.WebApi.ML.Model.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MNIST.WebApi.ML.Model
{
    public class OnnxModelScorer : IOnnxModelScorer
    {
        private readonly ModelSettings _modelSettings;
        private readonly MLContext _mlContext;
        private readonly ILogger _logger;

        public OnnxModelScorer(
            IConfiguration configuration,
            ILogger<OnnxModelScorer> logger)
        {
            _mlContext = new MLContext();
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _modelSettings = configuration.GetSection(nameof(ModelSettings)).Get<ModelSettings>()
                ?? throw new ArgumentNullException(nameof(_modelSettings));

            if (string.IsNullOrWhiteSpace(_modelSettings.ModelPath))
            {
                throw new ArgumentException($"'{nameof(_modelSettings.ModelPath)}' cannot be null or whitespace.", nameof(_modelSettings.ModelPath));
            }
        }

        protected ITransformer LoadModel(string modelLocation)
        {
            _logger.LogDebug($"Reading model at {modelLocation}.");
            _logger.LogDebug($"Image parameters: {nameof(_modelSettings.ImageWidth)}:{_modelSettings.ImageWidth}" +
                $", {nameof(_modelSettings.ImageHeight)}:{_modelSettings.ImageHeight}).");

            var data = _mlContext.Data.LoadFromEnumerable(new List<InputImageData>());

            var pipeline = _mlContext.Transforms
                .LoadImages(
                    outputColumnName: _modelSettings.InputTensorName,
                    imageFolder: "",
                    inputColumnName: nameof(InputImageData.ImagePath))
                .Append(_mlContext.Transforms.ResizeImages(
                    outputColumnName: _modelSettings.InputTensorName,
                    inputColumnName: _modelSettings.InputTensorName,
                    imageWidth: _modelSettings.ImageWidth,
                    imageHeight: _modelSettings.ImageHeight))
                .Append(_mlContext.Transforms.ConvertToGrayscale(
                    outputColumnName: _modelSettings.InputTensorName,
                    inputColumnName: _modelSettings.InputTensorName))
                .Append(_mlContext.Transforms.ExtractPixels(
                    outputColumnName: _modelSettings.InputTensorName,
                    outputAsFloatArray: true,
                    colorsToExtract: Microsoft.ML.Transforms.Image.ImagePixelExtractingEstimator.ColorBits.Blue,
                    scaleImage: 1f / 255f))
                .Append(_mlContext.Transforms.ApplyOnnxModel(
                    modelFile: modelLocation,
                    outputColumnNames: new[] { _modelSettings.OutputTensorName },
                    inputColumnNames: new[] { _modelSettings.InputTensorName }));

            var preview = pipeline.Preview(data);
            _logger.LogDebug($"Pipeline preview: {preview}.");

            var model = pipeline.Fit(data);
            return model;
        }

        protected IEnumerable<Prediction> PredictDataUsingModel(IDataView testData, ITransformer model)
        {
            IDataView scoredData = model.Transform(testData);

            IEnumerable<float[]> probabilities =
                scoredData.GetColumn<float[]>(_modelSettings.OutputTensorName);
            IEnumerable<string> imagePaths = scoredData.GetColumn<string>(nameof(InputImageData.ImagePath));
            IEnumerable<string> labels = scoredData.GetColumn<string>(nameof(InputImageData.Label));

            IEnumerator<float[]> scoreEnumerator = probabilities.GetEnumerator();
            IEnumerator<string> imagePathEnumerator = imagePaths.GetEnumerator();
            IEnumerator<string> labelEnumerator = labels.GetEnumerator();
            while (scoreEnumerator.MoveNext())
            {
                imagePathEnumerator.MoveNext();
                labelEnumerator.MoveNext();

                Dictionary<string, double> labelScorePairs = new();
                var predictedScores = scoreEnumerator.Current;
                for (int i = 0; i < predictedScores.Length; i++)
                    labelScorePairs.Add(i.ToString(), predictedScores[i]);

                yield return new Prediction
                {
                    Label = labelEnumerator.Current,
                    InputImage = imagePathEnumerator.Current,
                    LabelScorePairs = labelScorePairs
                };
            }
        }

        public IEnumerable<Prediction> Predict(IDataView data)
        {
            var model = LoadModel(_modelSettings.ModelPath);

            return PredictDataUsingModel(data, model);
        }

        public void ParseScores(IEnumerable<Prediction> predictions)
        {
            IEnumerator<Prediction> enumerator = predictions.GetEnumerator();
            while (enumerator.MoveNext())
                ParseScores(enumerator.Current);
        }

        public void ParseScores(Prediction prediction)
        {
            Dictionary<string, double> labelProbabilityPairs = new();

            List<KeyValuePair<string, double>> labelScorePairs = prediction.LabelScorePairs.ToList();
            IEnumerable<double> probabilities = Softmax(labelScorePairs.Select(lsp => lsp.Value));

            for (int i = 0; i < labelScorePairs.Count; i++)
                labelProbabilityPairs.Add(labelScorePairs[i].Key, probabilities.ElementAt(i));

            prediction.LabelProbabilityPairs = labelProbabilityPairs;
        }

        public IEnumerable<double> Softmax(IEnumerable<double> values)
        {
            var sum = values.Select(v => Math.Exp(v)).Sum();
            return values.Select(v => Math.Exp(v) / sum);
        }
    }
}
