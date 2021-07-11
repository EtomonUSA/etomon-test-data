pipeline {
    agent {
        docker {
            image '498742616314.dkr.ecr.us-east-1.amazonaws.com/etomon-nodejs-base:production'
            args '-u root --privileged'
        }
    }
    stages {
        stage('Install') {
            steps {
                sh 'awd && npm ci'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Publish') {
            steps {
                sh 'npm publish'
            }
        }
    }
}

