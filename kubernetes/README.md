# K8s Deployment

1. create the configmap:
```
kubectl create secret generic kantab-secrets --from-env-file=./.secret.example --namespace=default
```
2. Create the secrets:
```
kubectl create configmap generic kantab-configmap --from-env-file=./.env.example --namespace=default
```

3. Kubectl apply -f *.yaml

This will create all serives without ingress.