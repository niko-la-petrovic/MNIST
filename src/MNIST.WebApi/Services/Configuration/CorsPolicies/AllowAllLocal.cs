using Microsoft.AspNetCore.Cors.Infrastructure;
using System;

namespace MNIST.WebApi.Services.Configuration.CorsPolicies
{
    public class AllowAllLocal
    {
        public static readonly string Name = nameof(AllowAllLocal);

        public static readonly Action<CorsPolicyBuilder> Action = (builder) =>
        {
            builder.SetIsOriginAllowed(origin =>
            {
                return new Uri(origin).Host == "localhost";
            })
                .AllowAnyMethod()
                .AllowAnyHeader();
        };
    }
}
