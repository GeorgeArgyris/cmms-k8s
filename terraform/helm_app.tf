resource "helm_release" "cmms_app" {
  name       = "cmms"
  chart      = "../helm/cmms"
  namespace  = kubernetes_namespace.cmms.metadata[0].name


  values = [
    file("../values-secrets.yaml")
  ]

  set {
    name  = "backend.image.tag"
    value = var.app_version
  }
  set {
    name  = "frontend.image.tag"
    value = var.app_version
  }

  depends_on = [kubernetes_namespace.cmms]
}
