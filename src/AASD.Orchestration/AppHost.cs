var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("aacd").WithHostPort(51214).WithDataVolume().WithLifetime(ContainerLifetime.Persistent);
var postgresdb = postgres.AddDatabase("data");

builder.AddNpmApp("angular", "../AASD.Angular", "start")
  .WithEnvironment("DATABASE_URL", ReferenceExpression.Create($"{postgresdb.Resource.UriExpression}?schema=public"))
  .WaitFor(postgresdb)
  .WithHttpEndpoint(env: "PORT")
  .WithExternalHttpEndpoints();

builder.Build().Run();