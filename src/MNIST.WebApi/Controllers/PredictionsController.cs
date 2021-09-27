using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MNIST.WebApi.ML.Model;
using MNIST.WebApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MNIST.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PredictionsController : ControllerBase
    {
        private readonly IPredictionsService _predictionsService;
        private readonly IMultiDigitPredictionsService _multiDigitPredictionsService;

        public PredictionsController(IPredictionsService predictionsService, IMultiDigitPredictionsService multiNumberPredictionsService)
        {
            _predictionsService = predictionsService ?? throw new ArgumentNullException(nameof(predictionsService));
            _multiDigitPredictionsService = multiNumberPredictionsService ?? throw new ArgumentNullException(nameof(multiNumberPredictionsService));
        }

        [HttpPost("predict")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Prediction>))]
        public async Task<IActionResult> GetPrediction(
            [FromForm] PredictionInput predictionInput,
            bool multiDigit)
        {
            if (!predictionInput.Files.Any())
                return BadRequest("No files provided.");

            IEnumerable<Prediction> predictions;
            try
            {
                if (!multiDigit)
                    predictions = await _predictionsService.GetPredictionsAsync(predictionInput);
                else
                    predictions = await _multiDigitPredictionsService.GetPredictionsAsync(predictionInput);
            }
            catch (FileNotFoundException ex)
            {
                return BadRequest(ex.Message);
            }

            return Ok(predictions);
        }
    }
}
