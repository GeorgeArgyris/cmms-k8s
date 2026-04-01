#!/bin/bash

set -e

echo "🔧 Setting Minikube Docker environment..."
eval $(minikube docker-env)

echo "📦 Building Docker image..."
cd ~/cmms-k8s/frontend
docker build -t cmms-frontend:latest .

echo "🚀 Upgrading Helm release..."
helm upgrade cmms ~/cmms-k8s/helm/cmms

echo "👀 Watching pods..."
kubectl get pods -n cmms -w