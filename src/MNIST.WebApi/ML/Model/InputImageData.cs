using Microsoft.ML.Data;

namespace MNIST.WebApi
{
    public class InputImageData
    {
        [LoadColumn(0)]
        public string ImagePath;

        [LoadColumn(1)]
        public string Label;
    }
}
