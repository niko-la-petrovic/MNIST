using CommandLine;
using Humanizer;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;

namespace MNIST.IdxToImages
{
    partial class Program
    {
        public static IdxExporter IdxExporter { get; set; }

        public static ILoggerFactory LoggerFactory;

        static void Main(string[] args)
        {
            Parser.Default.ParseArguments<Options>(args)
                .WithParsed(o =>
                {
                    LoggerFactory = Microsoft.Extensions.Logging.LoggerFactory.Create(builder =>
                    {
                        builder.AddSimpleConsole(o =>
                        {
                            o.IncludeScopes = true;
                        });
                        builder.SetMinimumLevel(Enum.Parse<LogLevel>(o.LogLevel));
                    });

                    ILogger<Program> logger = LoggerFactory.CreateLogger<Program>();

                    Stopwatch stopwatch = Stopwatch.StartNew();
                    using (IdxExporter = new IdxExporter(o.IdxImagesFilePath,
                        o.IdxLabelsFilePath,
                        o.IdxImagesOutputPath,
                        o.IdxImagesSplitByValue,
                        o.IdxImagesExtension,
                        o.IdxMaxImagesToExport))
                    {
                        IdxExporter.Export().GetAwaiter().GetResult();
                    }

                    stopwatch.Stop();
                    logger.LogInformation($"Finished exporting images in" +
                        $" {TimeSpan.FromMilliseconds(stopwatch.ElapsedMilliseconds).Humanize()}.");
                });
        }
    }
}
