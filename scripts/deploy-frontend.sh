#!/bin/bash

set -e

echo "🔧 Setting Minikube Docker environment..."
eval $(minikube docker-env)

echo "📦 Building Docker image..."
cd ~/cmms-k8s/frontend
docker build -t cmms-frontend:latest .

echo "🚀 Restarting Kubernetes deployment..."
kubectl rollout restart deployment/frontend -n cmms

echo "👀 Watching pods..."
kubectl get pods -n cmms -w