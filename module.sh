#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
    echo "Please provide a name for the module."
    exit 1
fi

# Run nest commands
nest generate module $1 --no-spec
nest generate controller $1 --no-spec
nest generate service $1 --no-spec

# Create directory structure
mkdir -p src/$1/entities
mkdir -p src/$1/dto

# Create DTO file
touch src/$1/dto/create-$1.dto.ts

# Create Entity file
touch src/$1/entities/$1.entity.ts
