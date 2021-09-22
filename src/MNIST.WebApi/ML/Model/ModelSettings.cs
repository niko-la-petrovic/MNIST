using System;

namespace MNIST.WebApi.ML.Model
{
    // Use Netron to find input/output layer/tensor names
    public class ModelSettings
    {
        /// <summary>
        /// Input tensor name.
        /// </summary>
        public string InputTensorName { get; set; }

        /// <summary>
        /// Output tensor name.
        /// </summary>
        public string OutputTensorName { get; set; }

        public int ImageHeight { get; set; }

        public int ImageWidth { get; set; }

        public string ModelPath { get; set; }

        public ModelSettings()
        {
        }

        public ModelSettings(
            string modelInput,
            string modelOutput,
            int imageHeight,
            int imageWidth)
        {
            InputTensorName = modelInput;
            OutputTensorName = modelOutput;
            ImageHeight = imageHeight;
            ImageWidth = imageWidth;

            if (string.IsNullOrWhiteSpace(modelInput))
            {
                throw new System.ArgumentException($"'{nameof(modelInput)}' cannot be null or whitespace.", nameof(modelInput));
            }

            if (string.IsNullOrWhiteSpace(modelOutput))
            {
                throw new System.ArgumentException($"'{nameof(modelOutput)}' cannot be null or whitespace.", nameof(modelOutput));
            }

            if (imageHeight == 0)
                throw new ArgumentException(nameof(imageHeight));
            if (imageWidth == 0)
                throw new ArgumentException(nameof(imageWidth));
        }
    }
}
