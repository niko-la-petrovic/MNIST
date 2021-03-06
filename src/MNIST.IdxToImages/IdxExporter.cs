using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace MNIST.IdxToImages
{
    public class IdxExporter : IDisposable
    {
        public string ImagesFilePath { get; }
        public string LabelsFilePath { get; }
        public string ImagesOutputPath { get; }
        public bool SplitImagesByLabel { get; }
        public string ImageExtension { get; }
        public int MaxImagesToExport { get; }

        protected System.Drawing.Imaging.ImageFormat ImageFormat;

        protected FileStream ImagesFileStream;

        protected FileStream LabelsFileStream;

        protected ILogger<IdxExporter> logger;

        public IdxExporter(string imagesFilePath,
                     string labelsFilePath,
                     string imagesOutputPath,
                     bool splitImagesByLabel,
                     string imageExtension,
                     int maxImagesToExport)
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
            if (!Np.Imaging.Image.Extension.IsValidExtension(imageExtension))
            {
                throw new ArgumentException($"'{nameof(imageExtension)}' is an invalid image extension.", nameof(imageExtension));
            }

            ImagesFilePath = imagesFilePath;
            LabelsFilePath = labelsFilePath;
            ImagesOutputPath = imagesOutputPath;
            SplitImagesByLabel = splitImagesByLabel;
            ImageExtension = imageExtension;
            MaxImagesToExport = maxImagesToExport;
            ImageFormat = imageExtension.ToLower() switch
            {
                ".png" => System.Drawing.Imaging.ImageFormat.Png,
                ".jpg" or ".jpeg" => System.Drawing.Imaging.ImageFormat.Jpeg,
                ".tif" or ".tiff" => System.Drawing.Imaging.ImageFormat.Tiff,
                ".bmp" => System.Drawing.Imaging.ImageFormat.Bmp,
                ".gif" => System.Drawing.Imaging.ImageFormat.Gif,
                _ => throw new ArgumentException($"'{nameof(ImageExtension)}' is unsupported."),
            };
            logger.LogInformation($"Opening {imagesFilePath}.");
            ImagesFileStream = File.OpenRead(imagesFilePath);
            logger.LogInformation($"Opening {labelsFilePath}.");
            LabelsFileStream = File.OpenRead(labelsFilePath);
        }

        public void Dispose()
        {
            ImagesFileStream?.Dispose();
            LabelsFileStream?.Dispose();
        }

        public async Task Export()
        {
            // Preprocess Image File
            byte[] imageInfo = new byte[sizeof(int)];

            await ImagesFileStream.ReadAsync(imageInfo, 0, sizeof(int));
            Array.Reverse(imageInfo);
            int imageMagicNumber = BitConverter.ToInt32(imageInfo, 0);

            await ImagesFileStream.ReadAsync(imageInfo, 0, sizeof(int));
            Array.Reverse(imageInfo);
            int numberOfImages = BitConverter.ToInt32(imageInfo, 0);

            await ImagesFileStream.ReadAsync(imageInfo, 0, sizeof(int));
            Array.Reverse(imageInfo);
            int imageNumberOfRows = BitConverter.ToInt32(imageInfo, 0);

            await ImagesFileStream.ReadAsync(imageInfo, 0, sizeof(int));
            Array.Reverse(imageInfo);
            int imageNumberOfColumns = BitConverter.ToInt32(imageInfo, 0);

            // Preprocess Label File

            byte[] labelInfo = new byte[sizeof(int)];

            await LabelsFileStream.ReadAsync(labelInfo, 0, sizeof(int));
            Array.Reverse(labelInfo);
            int labelMagicNumber = BitConverter.ToInt32(labelInfo, 0);

            await LabelsFileStream.ReadAsync(labelInfo, 0, sizeof(int));
            Array.Reverse(labelInfo);
            int numberOfLabels = BitConverter.ToInt32(labelInfo, 0);

            // Validate

            ValidateParsedParams(imageMagicNumber, numberOfImages, labelMagicNumber, numberOfLabels);

            // Exporting

            DirectoryInfo outDirInfo = EnsureOutputDirectory();

            // Process streams

            int maxDigits = (int)Math.Ceiling(Math.Log10(numberOfImages));
            Dictionary<string, int> labels = new();

            byte[] labelBytes = new byte[1];
            byte[] pixels = new byte[imageNumberOfRows * imageNumberOfColumns];

            int min = Math.Min(Math.Min(numberOfImages, numberOfLabels), MaxImagesToExport);
            logger.LogInformation($"Exporting {min} images.");

            for (int i = 0; i < min; i++)
            {
                await ImagesFileStream.ReadAsync(pixels);
                await LabelsFileStream.ReadAsync(labelBytes);

                string label = $"{labelBytes[0]}";

                if (!labels.ContainsKey(label))
                {
                    labels.Add(label, 0);
                    if (SplitImagesByLabel)
                        outDirInfo.CreateSubdirectory(label);
                }
                else
                    labels[label]++;

                string fileName = $"{label}" +
                    $"-{i.ToString($"D{maxDigits}")}" +
                    $"-{labels[label].ToString($"D{maxDigits}")}" +
                    $"{ImageExtension}";
                string filePath;

                if (SplitImagesByLabel)
                    filePath = Path.Join(outDirInfo.FullName, label, fileName);
                else
                    filePath = Path.Join(outDirInfo.FullName, fileName);

                // TODO write method to take PixelFormat as arugment and to write bytes accordingly

                Bitmap bitmap = new Bitmap(imageNumberOfColumns,
                                                        imageNumberOfRows,
                                                        System.Drawing.Imaging.PixelFormat.Format8bppIndexed);

                unsafe
                {
                    System.Drawing.Imaging.BitmapData bitmapData = bitmap.LockBits(
                    new Rectangle(
                        0,
                        0,
                        imageNumberOfRows,
                        imageNumberOfColumns),
                    System.Drawing.Imaging.ImageLockMode.ReadWrite,
                    System.Drawing.Imaging.PixelFormat.Format8bppIndexed);

                    int stride = bitmapData.Stride;

                    byte* scan0 = (byte*)bitmapData.Scan0.ToPointer();
                    IntPtr scan0Ptr = (IntPtr)scan0;
                    for (int j = 0; j < pixels.Length; j++)
                    {
                        Marshal.WriteByte(scan0Ptr + j, pixels[j]);
                    }

                    bitmap.UnlockBits(bitmapData);
                }
                System.Drawing.Image image = bitmap;

                logger.LogTrace($"Saving image '{fileName}'.");
                image.Save(filePath, ImageFormat);
            }
        }

        private DirectoryInfo EnsureOutputDirectory()
        {
            DirectoryInfo outDirInfo;
            try
            {
                outDirInfo = Directory.CreateDirectory(ImagesOutputPath);
            }
            catch (Exception)
            {
                logger.LogError($"Failed to create '{nameof(ImagesOutputPath)}' with value '{ImagesOutputPath}'.");
                throw;
            }

            return outDirInfo;
        }

        private void ValidateParsedParams(int imageMagicNumber, int numberOfImages, int labelMagicNumber, int numberOfLabels)
        {
            if (imageMagicNumber != 2051)
                logger.LogWarning($"'{nameof(imageMagicNumber)}' is invalid.");

            if (labelMagicNumber != 2049)
                logger.LogWarning($"'{nameof(labelMagicNumber)}' is invalid.");

            if (numberOfImages != numberOfLabels)
                logger.LogWarning($"'{nameof(numberOfImages)}' doesn't match '{nameof(numberOfLabels)}'");
        }
    }
}
