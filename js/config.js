/**
 * Configuration settings for the Pepe AI Multitool application
 */

const Config = {
  // Application settings
  app: {
    name: 'Pepe AI Multitool',
    version: '1.1.0',
    debug: false,
  },
  
  // Default user settings
  defaultSettings: {
    theme: 'default', // Pepe light theme is the default
    fontSize: 16,
    reduceMotion: false,
    localStorageOnly: true,
    clearOnExit: false,
    disableAnalytics: true,
    autoReadResponses: false,
    speechRate: 1,
    speechVoice: '',
    speechRecognitionLang: 'en-US',
    chatPersistence: 'persistent' // Added: 'persistent' or 'session-only'
  },
  
  // Storage keys
  storage: {
    encryptionKey: 'pepe_multitool_encryption_key',
    settings: 'pepe_multitool_settings',
    chats: 'pepe_multitool_chats',
    integrations: 'pepe_multitool_integrations',
    currentChatId: 'pepe_multitool_current_chat',
    nodes: 'pepe_multitool_nodes',
    connections: 'pepe_multitool_connections'
  },
  
  // Supported AI provider types
  providers: {
    openai: {
      displayName: 'OpenAI',
      fields: [
        {
          label: 'API Key',
          type: 'password',
          name: 'api_key',
          sensitive: true,
          required: true
        },
        {
          label: 'Organization ID (optional)',
          type: 'text',
          name: 'organization',
          sensitive: false,
          required: false
        }
      ],
      defaultModels: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ]
    },
    anthropic: {
      displayName: 'Anthropic',
      fields: [
        {
          label: 'API Key',
          type: 'password',
          name: 'api_key',
          sensitive: true,
          required: true
        }
      ],
      defaultModels: [
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-opus', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku' }
      ]
    },
    groq: {
      displayName: 'Groq',
      fields: [
        {
          label: 'API Key',
          type: 'password',
          name: 'api_key',
          sensitive: true,
          required: true
        }
      ],
      defaultModels: [
        { id: 'llama3-8b-8192', name: 'Llama 3 8B' },
        { id: 'llama3-70b-8192', name: 'Llama 3 70B' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
        { id: 'gemma-7b-it', name: 'Gemma 7B' }
      ]
    },
    gemini: {
      displayName: 'Google Gemini',
      fields: [
        {
          label: 'API Key',
          type: 'password',
          name: 'api_key',
          sensitive: true,
          required: true
        }
      ],
      defaultModels: [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' }
      ]
    },
    mistral: {
      displayName: 'Mistral AI',
      fields: [
        {
          label: 'API Key',
          type: 'password',
          name: 'api_key',
          sensitive: true,
          required: true
        }
      ],
      defaultModels: [
        { id: 'mistral-large', name: 'Mistral Large' },
        { id: 'mistral-medium', name: 'Mistral Medium' },
        { id: 'mistral-small', name: 'Mistral Small' }
      ]
    },
    azure_openai: {
      displayName: 'Azure OpenAI',
      fields: [
        {
          label: 'API Key',
          type: 'password',
          name: 'api_key',
          sensitive: true,
          required: true
        },
        {
          label: 'Endpoint URL',
          type: 'text',
          name: 'endpoint',
          sensitive: false,
          required: true
        },
        {
          label: 'Deployment Name',
          type: 'text',
          name: 'deployment',
          sensitive: false,
          required: true
        }
      ],
      defaultModels: []
    },
    custom: {
      displayName: 'Custom Provider',
      fields: [
        {
          label: 'Provider Name',
          type: 'text',
          name: 'provider_name',
          sensitive: false,
          required: true
        },
        {
          label: 'API Endpoint',
          type: 'text',
          name: 'api_endpoint',
          sensitive: false,
          required: true
        },
        {
          label: 'Authorization Header',
          type: 'text',
          name: 'auth_header',
          sensitive: false,
          required: true
        },
        {
          label: 'API Key',
          type: 'password',
          name: 'api_key',
          sensitive: true,
          required: true
        },
        {
          label: 'Model',
          type: 'text',
          name: 'model',
          sensitive: false,
          required: true
        }
      ],
      defaultModels: []
    }
  },
  
  // Default system prompts for different tools
  defaultPrompts: {
    general: "You are a helpful, friendly AI assistant with a Pepe the Frog theme. Respond to the user in a concise and helpful manner.",
    codeAssistant: "You are an expert programming assistant. Help with writing code, debugging issues, and explaining programming concepts. Provide code examples where helpful.",
    documentAnalysis: "You are a document analysis assistant. Help users understand and extract information from documents they upload. Summarize key points and answer questions about the content.",
    imageGeneration: "You are an image generation assistant. Help users craft effective prompts for generating images. Describe details, styles, and guidance for creating the images they want.",
    nodeWorkflow: "You are a node workflow assistant. Help users create effective AI processing pipelines by connecting nodes in meaningful ways. Suggest node configurations and connections for different use cases."
  },
  
  // Default context size (in tokens) for different models
  contextSizes: {
    'gpt-4o': 128000,
    'gpt-4-turbo': 128000,
    'gpt-3.5-turbo': 16000,
    'claude-3-5-sonnet': 200000,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'llama3-70b-8192': 8192,
    'llama3-8b-8192': 8192,
    'mixtral-8x7b-32768': 32768,
    'gemini-1.5-pro': 1000000,
    'gemini-1.0-pro': 32000,
    'mistral-large': 32000,
    'mistral-medium': 32000,
    'mistral-small': 32000,
    'default': 16000
  },
  
  // Maximum file sizes for uploads (in bytes)
  maxFileSizes: {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    total: 20 * 1024 * 1024 // 20MB
  },
  
  // Sample quick prompt suggestions
  quickPrompts: [
    "Create a node workflow",
    "Help me debug my code",
    "Summarize a complex topic",
    "Generate creative content",
    "Write a professional email",
    "Create a content plan",
    "Analyze this data",
    "Explain a difficult concept"
  ],
  
  // Node types for the workflow editor
  nodeTypes: {
    text: {
      name: "Text Input",
      description: "Enter text to be processed by the workflow",
      inputs: [],
      outputs: ["text"]
    },
    image: {
      name: "Image Input",
      description: "Upload an image to be processed by the workflow",
      inputs: [],
      outputs: ["image"]
    },
    ai: {
      name: "AI Processing",
      description: "Process inputs with an AI model",
      inputs: ["any"],
      outputs: ["text"]
    },
    filter: {
      name: "Filter",
      description: "Filter content based on criteria",
      inputs: ["text"],
      outputs: ["text"]
    },
    combine: {
      name: "Combine",
      description: "Combine multiple inputs into one output",
      inputs: ["any", "any"],
      outputs: ["text"]
    },
    output: {
      name: "Output",
      description: "Final output of the workflow",
      inputs: ["any"],
      outputs: []
    }
  },
  
  // Default message templates
  messages: {
    welcome: "👋 Welcome to Pepe AI Multitool! Select a model to start chatting or use the node workflow editor.",
    noIntegration: "No AI integration available. Please add an integration in Settings.",
    errorResponse: "There was an error getting a response. Please try again.",
    fileTooBig: "The file you selected is too large. Maximum allowed size is {size}.",
    unsupportedFileType: "Unsupported file type. Please upload an image or document file.",
    emptyChatHistory: "Your chat history is empty. Start a new conversation to begin."
  }
};