var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("aasd")
    .WithHostPort(51214)
    .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin();

var postgresdb = postgres.AddDatabase("data");

var seq = builder.AddSeq("seq")
    .WithLifetime(ContainerLifetime.Persistent)
    .ExcludeFromManifest();

var backend = builder.AddProject<Projects.AASD_Backend_API>("backend")
  .WithReference(postgresdb, "BackendDatabase")
  .WithReference(seq)
  .WaitFor(postgresdb);

builder.AddNpmApp("angular", "../AASD.Angular", "start")
  .WithEnvironment("BACKEND_API_URL", backend.GetEndpoint("http"))
  .WithReference(seq)
  .WaitFor(backend)
  .WithHttpEndpoint(env: "PORT")
  .WithExternalHttpEndpoints();

builder.AddNpmApp("nextjs", "../AASD.NextJS", "start:aspire")
  .WithEnvironment("BACKEND_API_URL", backend.GetEndpoint("http"))
  .WithEnvironment("NEXT_PUBLIC_BACKEND_API_URL", backend.GetEndpoint("http"))
  .WithReference(seq)
  .WaitFor(backend)
  .WithHttpEndpoint(port: 3001, env: "PORT")
  .WithExternalHttpEndpoints();

// Prometheus — scrapes /metrics from .NET services
builder.AddContainer("prometheus", "prom/prometheus")
    .WithBindMount("./prometheus", "/etc/prometheus", isReadOnly: true)
    .WithHttpEndpoint(port: 9090, targetPort: 9090)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithExternalHttpEndpoints();

// Grafana — dashboards
builder.AddContainer("grafana", "grafana/grafana")
    .WithBindMount("./grafana/provisioning", "/etc/grafana/provisioning", isReadOnly: true)
    .WithHttpEndpoint(port: 3003, targetPort: 3000)
    .WithEnvironment("GF_SECURITY_ADMIN_PASSWORD", "admin")
    .WithEnvironment("GF_SECURITY_ADMIN_USER", "admin")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithExternalHttpEndpoints();

builder.Build().Run();
