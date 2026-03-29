#!/bin/bash

set -e

echo "🔧 Setting Minikube Docker environment..."
eval $(minikube docker-env)

echo "📦 Building Docker image..."
cd ~/cmms-k8s/backend
docker build -t cmmms-backend:latest .

echo "🚀 Restarting Kubernetes deployment..."
kubectl rollout restart deployment/backend -n cmmms

echo "👀 Watching pods..."
kubectl get pods -n cmmms -w