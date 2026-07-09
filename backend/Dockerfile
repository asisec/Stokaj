FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM alpine:3.20
RUN apk --no-cache add ca-certificates=20230706-r0 postgresql16-client=16.5-r0
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
