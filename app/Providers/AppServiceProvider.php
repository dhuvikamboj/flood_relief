<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Console\Commands\MarkExpired;
use Illuminate\Console\Scheduling\Schedule;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register console commands so they are discoverable by Artisan
        if ($this->app->runningInConsole()) {
            $this->commands([
                MarkExpired::class,
            ]);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Schedule the mark-expired command daily (register on boot)
        $this->app->booted(function () {
            if ($this->app->runningInConsole()) {
                $schedule = $this->app->make(Schedule::class);
                $schedule->command('app:mark-expired')->daily();
            }
        });
    }
}
