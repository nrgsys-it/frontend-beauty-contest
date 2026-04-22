var builder = DistributedApplication.CreateBuilder(args);

builder.AddNpmApp("angular", "../AASD.Angular", "start")
    .WithExternalHttpEndpoints();

builder.Build().Run();