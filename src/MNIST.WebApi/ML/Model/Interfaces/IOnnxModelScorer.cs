using Microsoft.ML;
using System.Collections.Generic;

namespace MNIST.WebApi.ML.Model.Interfaces
{
    public interface IOnnxModelScorer
    {
        void ParseScores(IEnumerable<Prediction> predictions);
        void ParseScores(Prediction prediction);
        IEnumerable<Prediction> Predict(IDataView data);
        IEnumerable<double> Softmax(IEnumerable<double> values);
    }
}