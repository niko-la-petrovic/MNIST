using CommandLine;

namespace MNIST.IdxToImages
{
    partial class Program
    {
        public class Options
        {
            [Option('i', "images", Required = false,
                Default = "train-images.idx3-ubyte",
                HelpText = "The path to the images idx file")]
            public string IdxImagesFilePath { get; set; }

            [Option('l', "labels", Required = false,
                Default = "train-labels.idx1-ubyte",
                HelpText = "The path to the labels idx file")]
            public string IdxLabelsFilePath { get; set; }

            [Option('s', "split", Required = false,
                Default = false,
                HelpText = "Whether to split the images into subfolders by the label value")]
            public bool IdxImagesSplitByValue { get; set; }

            [Option('o', "output", Required = false,
                Default = "./out/images",
                HelpText = "The path to the output images")]
            public string IdxImagesOutputPath { get; set; }

            [Option('e', "extension", Required = false,
                Default = ".png",
                HelpText = "The extension of the output images")]
            public string IdxImagesExtension { get; set; }

            [Option('n', "image-number", Required = false,
                Default = int.MaxValue,
                HelpText = "Maxmimum number of images to export")]
            public int IdxMaxImagesToExport { get; set; }

            [Option(longName: "log-level", Required = false,
                Default = "Information",
                HelpText = "The minimum log level")]
            public string LogLevel { get; set; }
        }
    }
}
