using System.Collections.Generic;

namespace MNIST.WebApi.ML.Model
{
    public class Prediction
    {
        public string Label { get; set; }

        public string InputImage { get; set; }

        public Dictionary<string, double> LabelScorePairs { get; set; }

        public Dictionary<string, double> LabelProbabilityPairs { get; set; }
    }
}
