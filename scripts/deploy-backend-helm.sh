#!/bin/bash

set -e

echo "🔧 Setting Minikube Docker environment..."
eval $(minikube docker-env)

echo "📦 Building Docker image..."
cd ~/cmms-k8s/backend
docker build -t cmms-backend:latest .

echo "🚀 Restarting Kubernetes deployment..."
kubectl rollout restart deployment backend -n cmms

echo "🚀 Upgrading Helm release..."
helm upgrade cmms ~/cmms-k8s/helm/cmms

echo "👀 Watching pods..."
kubectl get pods -n cmms -w