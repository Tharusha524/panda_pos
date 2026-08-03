<?php

namespace App\Providers;

use App\Interfaces\UserRepositoryInterface;
use App\Interfaces\ActivityLogRepositoryInterface;
use App\Models\ItemBatch;
use App\Observers\ItemBatchObserver;
use App\Repositories\UserRepository;
use App\Repositories\ActivityLogRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind repository interfaces to concrete implementations
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(ActivityLogRepositoryInterface::class, ActivityLogRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ItemBatch::observe(ItemBatchObserver::class);
    }
}
