# cmms-k8s

[![CI](https://github.com/GeorgeArgyris/cmms-k8s/actions/workflows/ci.yml/badge.svg)](https://github.com/GeorgeArgyris/cmms-k8s/actions/workflows/ci.yml)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)
![Helm](https://img.shields.io/badge/Helm-0F1689?style=flat&logo=helm&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

A **Computerized Maintenance Management System (CMMS)** deployed on Kubernetes with a full production-grade observability stack — Prometheus, Grafana, Alertmanager, and Discord alerting.

---

## Table of Contents

- [What is CMMS?](#what-is-cmms)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)

---

## What is CMMS?

A **Computerized Maintenance Management System** is software used by facilities and operations teams to manage:

- **Assets** — machines, equipment, infrastructure
- **Work Orders** — maintenance tasks assigned to technicians
- **Schedules** — planned preventive maintenance
- **Users** — technicians, managers, admins

This project implements a CMMS backend API + frontend, fully containerized and deployed on Kubernetes.

---

## Architecture

```
                        ┌──────────────────────────────────────────┐
                        │           Kubernetes Cluster             │
                        │                                          │
  User Browser ────────►│  frontend (nginx)                        │
                        │       │                                  │
                        │       ▼                                  │
                        │  backend (Node.js/Express)               │
                        │       │            │                     │
                        │       ▼            ▼                     │
                        │  PostgreSQL    /metrics ◄── Prometheus   │
                        │                        │                 │
                        │                        ▼                 │
                        │                    Grafana               │
                        │                    Alertmanager          │
                        │                        │                 │
                        └────────────────────────┼─────────────────┘
                                                 ▼
                                          Discord #alerts
```

**Namespaces:**
- `cmms` — application (frontend, backend, postgres)
- `monitoring` — observability stack (Prometheus, Grafana, Alertmanager, Discord proxy)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML, CSS, JavaScript, Nginx |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL |
| **Containerization** | Docker |
| **Orchestration** | Kubernetes (Minikube for local) |
| **Package Manager** | Helm |
| **Metrics** | prom-client (Node.js), Prometheus |
| **Dashboards** | Grafana |
| **Alerting** | Alertmanager + Discord |
| **CI/CD** | GitHub Actions |

---

## Project Structure

```
.
├── LICENSE
├── README.md
├── backend
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.js
│   ├── package-lock.json
│   ├── package.json
│   └── src
│       ├── __tests__
│       │   ├── assets.test.js
│       │   ├── auth.test.js
│       │   ├── dashboard.test.js
│       │   ├── health.test.js
│       │   ├── helpers.js
│       │   ├── middleware.test.js
│       │   ├── users.test.js
│       │   └── workOrders.test.js
│       ├── app.js
│       ├── controllers
│       │   └── authController.js
│       ├── db
│       │   ├── pool.js
│       │   ├── schema.sql
│       │   └── seed.sql
│       ├── middleware
│       │   ├── auth.js
│       │   └── metrics.js
│       └── routes
│           ├── assets.js
│           ├── auth.js
│           ├── dashboard.js
│           ├── schedules.js
│           ├── users.js
│           └── workOrders.js
├── docker-compose.test.yml
├── frontend
│   ├── Dockerfile
│   ├── components
│   │   └── sidebar.html
│   ├── css
│   │   └── main.css
│   ├── index.html
│   ├── js
│   │   └── auth.js
│   ├── nginx.conf
│   └── pages
│       ├── assets.html
│       ├── dashboard.html
│       ├── schedule.html
│       ├── users.html
│       └── work-orders.html
├── helm
│   ├── alertmanager-values.yaml
│   └── cmms
│       ├── Chart.yaml
│       ├── templates
│       │   ├── backend.yaml
│       │   ├── discord-webhook.yaml
│       │   ├── frontend.yaml
│       │   ├── namespace.yaml
│       │   ├── postgres.yaml
│       │   ├── prometheusrule.yaml
│       │   └── secret.yaml
│       └── values.yaml
├── k8s
│   ├── backend.yaml
│   ├── frontend.yaml
│   ├── ingress.yaml
│   ├── namespace.yaml
│   ├── postgres-secret.yaml
│   ├── postgres.yaml
│   └── servicemonitor.yaml
├── package-lock.json
├── package.json
├── scripts
│   ├── deploy-backend-helm.sh
│   ├── deploy-backend.sh
│   ├── deploy-frontend-helm.sh
│   ├── deploy-frontend.sh
│   └── run_tests.sh
└── values-secrets.yaml
```