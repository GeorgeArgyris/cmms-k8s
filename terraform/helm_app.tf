resource "helm_release" "cmms_app" {
  name       = "cmms"
  chart      = "../helm/cmms"
  namespace  = kubernetes_namespace.cmms.metadata[0].name


  values = [
    file("../values-secrets.yaml")
  ]

  set {
    name  = "backend.replicas"
    value = "2"
  }

  set {
    name  = "frontend.replicas"
    value = "2"
  }

  depends_on = [kubernetes_namespace.cmms]
}
