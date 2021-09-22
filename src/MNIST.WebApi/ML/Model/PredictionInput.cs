using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MNIST.WebApi.ML.Model
{
    public class PredictionInput
    {
        [Required]
        public List<IFormFile> Files { get; set; }

        public Dictionary<string, string> FileLabels { get; set; }
    }
}
