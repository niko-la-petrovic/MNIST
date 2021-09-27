using Microsoft.ML.Data;
using System;

namespace MNIST.WebApi
{
    public class InputImageData
    {
        [LoadColumn(0)]
        public string ImagePath;

        [LoadColumn(1)]
        public string Label;

        public override bool Equals(object obj)
        {
            return obj is InputImageData data &&
                   ImagePath == data.ImagePath &&
                   Label == data.Label;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(ImagePath, Label);
        }
    }
}
