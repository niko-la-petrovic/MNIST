using Microsoft.Extensions.Configuration;
using Microsoft.ML;
using MNIST.WebApi.ML.Model;
using MNIST.WebApi.ML.Model.Interfaces;
using MNIST.WebApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MNIST.WebApi.Services
{
    public class PredictionsService : IPredictionsService
    {
        private readonly MLContext _mlContext;
        private readonly IOnnxModelScorer _onnxModelScorer;

        public PredictionsService(
            IConfiguration configuration,
            IOnnxModelScorer onnxModelScorer)
        {
            _mlContext = new MLContext();
            _onnxModelScorer = onnxModelScorer ?? throw new ArgumentNullException(nameof(onnxModelScorer));
        }

        public async Task<IEnumerable<Prediction>> GetPredictionsAsync(PredictionInput predictionInput)
        {
            System.Collections.Concurrent.ConcurrentDictionary<string, string> uploadedFiles = new();
            foreach (var file in predictionInput.Files)
            {
                string extension = Path.GetExtension(file.FileName);
                if (!Np.Imaging.Image.Extension.IsValidExtension(extension))
                    continue;

                var copyToPath = Path.ChangeExtension(Path.GetTempFileName(), extension);
                using var copyTo = File.Create(copyToPath);

                await file.CopyToAsync(copyTo);
                uploadedFiles.TryAdd(copyToPath, file.FileName);
            }

            if (!uploadedFiles.Any())
                throw new FileNotFoundException("Failed to upload files. Possibly incorrect extension or upload process failed.");

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

            IDataView imageDataView = _mlContext.Data.LoadFromEnumerable(images);

            List<Prediction> predictions = _onnxModelScorer.Predict(imageDataView).ToList();
            _onnxModelScorer.ParseScores(predictions);

            return predictions;
        }
    }
}
