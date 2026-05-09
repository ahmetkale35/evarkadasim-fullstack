# Aşama 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["EvArkadasimV2.API/EvArkadasimV2.API.csproj", "EvArkadasimV2.API/"]
COPY ["EvArkadasimV2.Application/EvArkadasimV2.Application.csproj", "EvArkadasimV2.Application/"]
COPY ["EvArkadasimV2.Domain/EvArkadasimV2.Domain.csproj", "EvArkadasimV2.Domain/"]
COPY ["EvArkadasimV2.Infrastructure/EvArkadasimV2.Infrastructure.csproj", "EvArkadasimV2.Infrastructure/"]
RUN dotnet restore "EvArkadasimV2.API/EvArkadasimV2.API.csproj"

COPY . .
RUN dotnet publish "EvArkadasimV2.API/EvArkadasimV2.API.csproj" -c Release -o /app/publish --no-restore

# Aşama 2: Runtime (~200MB vs SDK'nın ~800MB)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

RUN mkdir -p /data && chmod 777 /data

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 80

ENTRYPOINT ["dotnet", "EvArkadasimV2.API.dll"]
