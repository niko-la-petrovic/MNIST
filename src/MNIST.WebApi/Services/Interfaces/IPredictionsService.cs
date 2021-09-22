using MNIST.WebApi.ML.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MNIST.WebApi.Services.Interfaces
{
    public interface IPredictionsService
    {
        Task<IEnumerable<Prediction>> GetPredictionsAsync(PredictionInput predictionInput);
    }
}