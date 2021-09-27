using Microsoft.Extensions.Configuration;
using Microsoft.ML;
using MNIST.WebApi.ML.Model;
using MNIST.WebApi.ML.Model.Interfaces;
using MNIST.WebApi.Services.Interfaces;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MNIST.WebApi.Services
{
    public class PredictionsService : IPredictionsService
    {
        private readonly MLContext _mlContext;
        protected readonly IOnnxModelScorer OnnxModelScorer;

        public PredictionsService(
            IConfiguration configuration,
            IOnnxModelScorer onnxModelScorer)
        {
            _mlContext = new MLContext();
            OnnxModelScorer = onnxModelScorer ?? throw new ArgumentNullException(nameof(onnxModelScorer));
        }

        public virtual async Task<IEnumerable<Prediction>> GetPredictionsAsync(PredictionInput predictionInput)
        {
            ConcurrentDictionary<string, string> uploadedFiles = await UploadFiles(predictionInput);

            List<InputImageData> images = PrepareInputImageData(predictionInput, uploadedFiles);

            return Predict(images);
        }

        protected virtual List<Prediction> Predict(IEnumerable<InputImageData> images)
        {
            IDataView imageDataView = _mlContext.Data.LoadFromEnumerable(images);

            List<Prediction> predictions = OnnxModelScorer.Predict(imageDataView).ToList();
            OnnxModelScorer.ParseScores(predictions);
            return predictions;
        }

        protected virtual List<InputImageData> PrepareInputImageData(PredictionInput predictionInput, ConcurrentDictionary<string, string> uploadedFiles)
        {
            List<InputImageData> images = new();
            var enumerator = uploadedFiles.GetEnumerator();
            while (enumerator.MoveNext())
            {
                images.Add(new InputImageData
                {
                    ImagePath = enumerator.Current.Key,
                    Label = predictionInput?.FileLabels?
                        .GetValueOrDefault(Path.GetFileNameWithoutExtension(enumerator.Current.Value))
                });
            }

            return images;
        }

        /// <summary>
        /// Uploads user files locally.
        /// </summary>
        /// <param name="predictionInput"></param>
        /// <returns>Key value pairs of uploaded file path and original file name.</returns>
        protected virtual async Task<ConcurrentDictionary<string, string>> UploadFiles(PredictionInput predictionInput)
        {
            System.Collections.Concurrent.ConcurrentDictionary<string, string> uploadedFiles = new();
            foreach (var file in predictionInput.Files)
            {
                string extension = Path.GetExtension(file.FileName);
                if (!Np.Imaging.Image.Extension.IsValidExtension(extension))
                    continue;

                var copyToPath = CopyToPath(extension);
                using (var copyTo = File.Create(copyToPath))
                {
                    await file.CopyToAsync(copyTo);
                    uploadedFiles.TryAdd(copyToPath, file.FileName);
                }
            }

            if (!uploadedFiles.Any())
                throw new FileNotFoundException("Failed to upload files. Possibly incorrect extension or upload process failed.");
            return uploadedFiles;
        }

        protected string CopyToPath(string extension)
        {
            return Path.ChangeExtension(Path.GetTempFileName(), extension);
        }
    }
}
