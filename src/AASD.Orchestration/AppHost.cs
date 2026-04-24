var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("aasd").WithHostPort(51214).WithDataVolume().WithLifetime(ContainerLifetime.Persistent);
var postgresdb = postgres.AddDatabase("data");
var backend = builder.AddProject<Projects.AASD_Backend_API>("backend")
  .WithReference(postgresdb, "BackendDatabase")
  .WaitFor(postgresdb);

builder.AddNpmApp("angular", "../AASD.Angular", "start")
  .WithEnvironment("BACKEND_API_URL", backend.GetEndpoint("http"))
  .WaitFor(backend)
  .WithHttpEndpoint(env: "PORT")
  .WithExternalHttpEndpoints();



builder.AddNpmApp("nextjs", "../AASD.NextJS", "start:aspire")
  .WithEnvironment("BACKEND_API_URL", backend.GetEndpoint("http"))
  .WithEnvironment("NEXT_PUBLIC_BACKEND_API_URL", backend.GetEndpoint("http"))
  .WaitFor(backend)
  .WithHttpEndpoint(port: 3001, env: "PORT")
  .WithExternalHttpEndpoints();

builder.Build().Run();
