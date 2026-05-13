#!/bin/bash

echo "Cleaning up old port-forwards..."
pkill -f "kubectl port-forward"

echo "Starting Port Forwards in the background..."

# 1. Prometheus (9090)
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090 > /dev/null 2>&1 &

# 2. Grafana (3000)
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80 > /dev/null 2>&1 &

# 3. Frontend (already on NodePort 30081, but we can map it to 8080 for convenience)
kubectl -n cmms port-forward svc/frontend-service 8080:80 > /dev/null 2>&1 &

# Wait a second for connections to establish
sleep 2

# Fetch Grafana Password
PASS=$(kubectl get secret --namespace monitoring -l app.kubernetes.io/component=admin-secret -o jsonpath="{.items[0].data.admin-password}" | base64 --decode)

echo "-------------------------------------------------------"
echo "CMMS Frontend: http://localhost:8080"
echo "- Email: admin@cmms.dev"
echo "- Password: password"
echo "Grafana: http://localhost:3000" 
echo "- Admin User: admin"
echo "- Admin Password: $PASS"
echo "Prometheus: http://localhost:9090"
echo "-------------------------------------------------------"
