using CommandLine;
using Microsoft.Extensions.Logging;
using Np.Imaging;
using System;
using System.IO;
using System.Threading.Tasks;

namespace MNIST.IdxToImages
{
    class IdxExporter : IDisposable
    {
        public string ImagesFilePath { get; }
        public string LabelsFilePath { get; }
        public string ImagesOutputPath { get; }
        public bool SplitImagesByLabel { get; }
        public string ImageExtension { get; }

        protected FileStream imagesFileStream;

        protected FileStream labelsFileStream;

        protected ILogger<IdxExporter> logger;

        public IdxExporter(string imagesFilePath,
                     string labelsFilePath,
                     string imagesOutputPath,
                     bool splitImagesByLabel,
                     string imageExtension)
        {
            logger = Program.LoggerFactory.CreateLogger<IdxExporter>();

            if (string.IsNullOrWhiteSpace(imagesFilePath))
            {
                throw new ArgumentException($"'{nameof(imagesFilePath)}' cannot be null or whitespace.", nameof(imagesFilePath));
            }

            if (string.IsNullOrWhiteSpace(labelsFilePath))
            {
                throw new ArgumentException($"'{nameof(labelsFilePath)}' cannot be null or whitespace.", nameof(labelsFilePath));
            }

            if (string.IsNullOrWhiteSpace(imagesOutputPath))
            {
                throw new ArgumentException($"'{nameof(imagesOutputPath)}' cannot be null or whitespace.", nameof(imagesOutputPath));
            }

            if (string.IsNullOrWhiteSpace(imageExtension))
            {
                throw new ArgumentException($"'{nameof(imageExtension)}' cannot be null or whitespace.", nameof(imageExtension));
            }
            if (!Image.Extension.IsValidExtension(imageExtension))
            {
                throw new ArgumentException($"'{nameof(imageExtension)}' is an invalid image extension.", nameof(imageExtension));
            }

            ImagesFilePath = imagesFilePath;
            LabelsFilePath = labelsFilePath;
            ImagesOutputPath = imagesOutputPath;
            SplitImagesByLabel = splitImagesByLabel;
            ImageExtension = imageExtension;

            logger.LogInformation($"Opening {imagesFilePath}");
            imagesFileStream = File.OpenRead(imagesFilePath);
            logger.LogInformation($"Opening {labelsFilePath}");
            labelsFileStream = File.OpenRead(labelsFilePath);
        }

        public void Dispose()
        {
            imagesFileStream?.Dispose();
            labelsFileStream?.Dispose();
        }

        public async Task Export()
        {
            int FlipByteOrder(int i)
            {
                unsafe
                {
                    int* ptr = &i;
                    int bytesToFlip = sizeof(int)
                }
                
            }

            // Preprocess Image File
            byte[] imageInfo = new byte[2 * 4 * sizeof(int)];
            int imageOffset = 0;

            await imagesFileStream.ReadAsync(imageInfo, imageOffset += sizeof(int), sizeof(int));
            await imagesFileStream.ReadAsync(imageInfo, imageOffset += sizeof(int), sizeof(int));
            await imagesFileStream.ReadAsync(imageInfo, imageOffset += sizeof(int), sizeof(int));
            await imagesFileStream.ReadAsync(imageInfo, imageOffset += sizeof(int), sizeof(int));

            imageOffset = 0;
            int imageMagicNumber = FlipByteOrder(BitConverter.ToInt32(imageInfo, imageOffset += sizeof(int)));
            int numberOfImages = BitConverter.ToInt32(imageInfo, imageOffset += sizeof(int));
            int imageNumberOfRows = BitConverter.ToInt32(imageInfo, imageOffset += sizeof(int));
            int imageNumberOfColumns = BitConverter.ToInt32(imageInfo, imageOffset += sizeof(int));

            // Preprocess Label File

            byte[] labelInfo = new byte[2 * 2 * sizeof(int)];
            int labelOffset = 0;

            await labelsFileStream.ReadAsync(labelInfo, labelOffset += sizeof(int), sizeof(int));
            await labelsFileStream.ReadAsync(labelInfo, labelOffset += sizeof(int), sizeof(int));

            labelOffset = 0;
            int labelMagicNumber = BitConverter.ToInt32(labelInfo, labelOffset += sizeof(int));
            int numberOfLabels = BitConverter.ToInt32(labelInfo, labelOffset += sizeof(int));

            // Exporting


        }
    }

    class Program
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
                Default = true,
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
        }

        public static IdxExporter IdxExporter { get; set; }

        public static ILoggerFactory LoggerFactory;

        static void Main(string[] args)
        {
            LoggerFactory = Microsoft.Extensions.Logging.LoggerFactory.Create(builder =>
            {
                builder.AddSimpleConsole(o =>
                {
                    o.IncludeScopes = true;
                });
            });

            Parser.Default.ParseArguments<Options>(args)
                .WithParsed(o =>
                {
                    IdxExporter = new IdxExporter(o.IdxImagesFilePath,
                        o.IdxLabelsFilePath,
                        o.IdxImagesOutputPath,
                        o.IdxImagesSplitByValue,
                        o.IdxImagesExtension);
                    IdxExporter.Export().GetAwaiter().GetResult();
                });
        }
    }
}
