#!/usr/bin/env node

// Test script to verify AWS authentication configuration
const { fromIni } = require("@aws-sdk/credential-providers");
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

async function getAwsCredentials() {
    // Check if AWS credentials are provided via environment variables
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken = process.env.AWS_SESSION_TOKEN;

    if (accessKeyId && secretAccessKey) {
        console.log('✅ Using AWS credentials from environment variables');
        console.log(`   Access Key ID: ${accessKeyId.substring(0, 8)}...`);
        console.log(`   Secret Access Key: ${secretAccessKey.substring(0, 8)}...`);
        if (sessionToken) {
            console.log(`   Session Token: ${sessionToken.substring(0, 8)}...`);
        }
        
        return {
            accessKeyId,
            secretAccessKey,
            ...(sessionToken && { sessionToken })
        };
    } else {
        // Fall back to AWS profile-based authentication
        const profileName = process.env.AWS_PROFILE_NAME || process.env.AWS_PROFILE || 'default';
        console.log(`✅ Using AWS profile: ${profileName}`);
        
        try {
            const credentialsProvider = fromIni({ profile: profileName });
            const credentials = await credentialsProvider();
            console.log(`   Access Key ID: ${credentials.accessKeyId.substring(0, 8)}...`);
            console.log(`   Secret Access Key: ${credentials.secretAccessKey.substring(0, 8)}...`);
            if (credentials.sessionToken) {
                console.log(`   Session Token: ${credentials.sessionToken.substring(0, 8)}...`);
            }
            return credentials;
        } catch (error) {
            console.error(`❌ Error loading AWS profile '${profileName}':`, error.message);
            throw error;
        }
    }
}

async function main() {
    console.log('🔐 Testing AWS Authentication Configuration\n');
    
    console.log('Environment Variables:');
    console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set'}`);
    console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`   AWS_SESSION_TOKEN: ${process.env.AWS_SESSION_TOKEN ? '✅ Set' : '❌ Not set'}`);
    console.log(`   AWS_PROFILE_NAME: ${process.env.AWS_PROFILE_NAME || '❌ Not set'}`);
    console.log(`   AWS_PROFILE: ${process.env.AWS_PROFILE || '❌ Not set'}`);
    console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'us-east-1 (default)'}`);
    console.log(`   SYSTEM_PROMPT: ${process.env.SYSTEM_PROMPT ? '✅ Set (custom)' : '❌ Not set (using default)'}`);
    console.log(`   ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS ? '✅ Set' : '❌ Not set'}`);
    console.log(`   WEBSOCKET_SERVER_URL: ${process.env.WEBSOCKET_SERVER_URL ? '✅ Set' : '❌ Not set'}\n`);
    
    try {
        const credentials = await getAwsCredentials();
        console.log('\n✅ Authentication configuration is valid!');
        console.log('\nYou can now start the Nova Sonic application with:');
        console.log('   npm start');
    } catch (error) {
        console.error('\n❌ Authentication configuration failed!');
        console.error('\nPlease check your AWS credentials configuration:');
        console.error('1. Set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
        console.error('2. Or configure AWS profile: aws configure --profile <profile-name>');
        console.error('3. Or set AWS_PROFILE_NAME environment variable');
        process.exit(1);
    }
}

main().catch(console.error);
