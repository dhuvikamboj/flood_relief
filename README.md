# 🌊 Flood Relief Coordination Platform

A comprehensive digital platform for coordinating flood relief efforts, connecting those in need with available resources and enabling real-time emergency response management.

## 🚀 Overview

The Flood Relief Platform is a full-stack application designed to streamline disaster response operations during flood emergencies. It provides an intuitive interface for reporting relief requests, managing resources, and coordinating aid distribution through interactive maps and real-time data.

### Key Features

- **📍 Interactive Map Interface**: Explore relief requests and resources with provider-agnostic map abstraction
- **🆘 Emergency Request System**: Submit and track relief requests with priority levels
- **📦 Resource Management**: Add and manage available relief resources (shelters, medical aid, supplies)
- **🗺️ Location Exploration**: Click anywhere on maps to explore different areas and find nearby aid
- **📱 Mobile-First Design**: Responsive PWA built with Ionic React for cross-platform compatibility
- **🌐 Multilingual Support**: Built-in internationalization with language switching
- **🔐 User Authentication**: Secure login system with role-based access control
- **📊 Real-time Analytics**: Track relief operations with integrated Google Analytics
- **💬 Comments System**: Collaborative communication on requests and resources

## 🏗️ Architecture

### Frontend (Mobile App)
- **Framework**: Ionic React with TypeScript
- **Build Tool**: Vite
- **Maps**: Leaflet with provider abstraction layer
- **State Management**: React Context API
- **Styling**: Ionic CSS with custom theming
- **PWA**: Service Worker support for offline functionality

### Backend (API Server)
- **Framework**: Laravel 12 (PHP 8.2)
- **Database**: SQLite (development) / MySQL (production)
- **Authentication**: Laravel Sanctum
- **Queue System**: Database-backed job processing
- **API**: RESTful endpoints with JSON responses

## 📁 Project Structure

```
flood_relief/
├── FloodReliefApp/                 # Ionic React Mobile App
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Application screens
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── contexts/               # React Context providers
│   │   ├── providers/              # Service providers (maps, API)
│   │   ├── services/               # API and external services
│   │   ├── types/                  # TypeScript type definitions
│   │   └── config/                 # Configuration files
│   ├── public/                     # Static assets
│   └── capacitor.config.ts         # Capacitor configuration
├── app/                            # Laravel Backend
│   ├── Http/Controllers/           # API controllers
│   ├── Models/                     # Eloquent models
│   └── ...
├── database/
│   ├── migrations/                 # Database schema
│   └── factories/                  # Test data factories
├── routes/
│   ├── api.php                     # API routes
│   └── web.php                     # Web routes
└── composer.json                   # PHP dependencies
```

## 🛠️ Installation & Setup

### Prerequisites

- **PHP 8.2+** with required extensions
- **Composer** for PHP dependencies
- **Node.js 18+** and **npm** for frontend
- **SQLite** (included) or **MySQL** for database

### Backend Setup (Laravel)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flood_relief
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Database setup**
   ```bash
   php artisan migrate
   php artisan db:seed  # Optional: seed with test data
   ```

5. **Start the development server**
   ```bash
   composer dev  # Runs all services concurrently
   ```

   Or run services individually:
   ```bash
   php artisan serve          # API server (port 8000)
   php artisan queue:listen   # Background job processing
   php artisan pail           # Live logging/diagnostics
   ```

### Frontend Setup (Ionic React)

1. **Navigate to the app directory**
   ```bash
   cd FloodReliefApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev  # Vite dev server with hot reload
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Mobile Development

1. **Add platforms**
   ```bash
   npx ionic capacitor add ios
   npx ionic capacitor add android
   ```

2. **Build and sync**
   ```bash
   npm run build
   npx ionic capacitor sync
   ```

3. **Run on device**
   ```bash
   npx ionic capacitor run ios
   npx ionic capacitor run android
   ```

## 🗺️ Map System Architecture

The platform features a sophisticated map abstraction system that allows switching between different map providers:

### Map Provider Abstraction
- **IMapProvider Interface**: Standardized API for all map providers
- **LeafletMapProvider**: Current implementation using Leaflet
- **MapProviderFactory**: Factory pattern for provider instantiation
- **Provider-agnostic hooks**: `useMap`, `useResourceMap`, `useRequestMap`

### Map Features
- **Interactive markers** for requests and resources
- **Click-to-explore** functionality with temporary location markers
- **GPS integration** with location watching
- **Multiple map layers** (satellite, streets, terrain, topographic)
- **Custom marker icons** based on request/resource types
- **Popup information** with detailed data

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get authenticated user info

### Relief Requests
- `GET /api/requests` - Get nearby requests (with location filtering)
- `POST /api/requests` - Create new relief request
- `PUT /api/requests/{id}` - Update request status
- `GET /api/user/requests` - Get user's own requests

### Relief Resources
- `GET /api/resources` - Get nearby resources (with location filtering)
- `POST /api/resources` - Add new resource
- `PUT /api/resources/{id}` - Update resource availability

### Comments
- `GET /api/requests/{id}/comments` - Get request comments
- `POST /api/requests/{id}/comments` - Add comment to request

## 🌍 Environment Configuration

### Backend (.env)
```env
APP_NAME="Flood Relief Platform"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# DB_DATABASE=absolute/path/to/database.sqlite

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:8100
```

### Frontend
Environment variables are configured in the `src/config/` directory:
- `api.ts` - API base URL configuration
- `mapConfig.ts` - Map provider settings
- `analytics.ts` - Google Analytics configuration

## 🧪 Testing

### Backend Testing
```bash
composer test           # Run PHPUnit tests
php artisan test        # Laravel test runner
```

### Frontend Testing
```bash
npm run test.unit       # Vitest unit tests
npm run test.e2e        # Cypress end-to-end tests
npm run lint            # ESLint code analysis
```

## 📱 Progressive Web App (PWA)

The application is built as a PWA with:
- **Offline support** through service workers
- **App-like experience** on mobile devices
- **Push notifications** (configurable)
- **Install prompts** for home screen addition

## 🔒 Security Features

- **Laravel Sanctum** for API authentication
- **CSRF protection** on all forms
- **Input validation** and sanitization
- **SQL injection prevention** through Eloquent ORM
- **XSS protection** with Content Security Policy
- **Rate limiting** on API endpoints

## 🌐 Internationalization

The platform supports multiple languages:
- **React i18next** for frontend translations
- **Language detection** based on browser settings
- **Dynamic language switching** without page reload
- **Extensible translation system** for new languages

## 📊 Analytics & Monitoring

- **Google Analytics 4** integration
- **User interaction tracking** (page views, feature usage)
- **Performance monitoring** with custom events
- **Error tracking** and diagnostics
- **Real-time logging** with Laravel Pail

## 🚀 Deployment

### Production Build
```bash
# Backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
npm run build
```

### Docker Deployment
Docker configuration can be added for containerized deployment:
- **Multi-stage builds** for optimized images
- **Environment-specific configurations**
- **Database and Redis containers**

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow **PSR-12** coding standards for PHP
- Use **TypeScript strict mode** for frontend
- Write **unit tests** for new features
- Update **documentation** for API changes
- Follow **conventional commits** for commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Issues**: [GitHub Issues](../../issues)
- **Documentation**: Check the `/docs` directory
- **Community**: Join our discussion forums

## 🙏 Acknowledgments

- **Laravel Framework** for the robust backend foundation
- **Ionic Framework** for the cross-platform mobile capabilities
- **Leaflet** for the mapping functionality
- **OpenStreetMap** contributors for map data
- **All contributors** who help improve this platform

---

**⚡ Built with urgency, designed for impact** - Helping communities coordinate relief efforts when every second counts.
