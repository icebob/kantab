# K8s Deployment

1. create the secret:
Copy the `.secret.example` to `.secret` and set your values
```
kubectl create secret generic kantab-secrets --from-env-file=./.secret --namespace=default
```
2. Create a configmap:
Copy the `.env.example` to `.env` and set your values
```
kubectl create configmap kantab-configmap --from-env-file=./.env --namespace=default
```

3. Apply yamls
```
kubectl apply -f .
```

This will create all services without ingress.
