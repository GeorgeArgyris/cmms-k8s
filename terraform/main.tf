terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

provider "kubernetes" {
  # This tells Terraform to use your default context in ~/.kube/config
  config_path = "~/.kube/config"
}

# We will start by managing your namespaces through Terraform
resource "kubernetes_namespace" "cmms" {
  metadata {
    name = "cmms"
    labels = {
      managed-by = "terraform"
    }
  }
}

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = {
      managed-by = "terraform"
    }
  }
}
