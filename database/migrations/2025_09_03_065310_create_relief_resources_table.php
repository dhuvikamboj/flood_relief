<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('relief_resources', function (Blueprint $table) {
            $table->id();
            $table->string('location')->nullable();
            $table->string('address')->nullable();
            $table->string('contact')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('resource_type')->nullable(); // food, medical, shelter, water, supplies
            $table->text('details')->nullable();
            $table->integer('capacity')->nullable(); // how many people it can serve
            $table->string('availability')->default('available'); // available, limited, unavailable
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->json('photos')->nullable();
            $table->string('videos')->nullable();

            $table->foreignId('user_id')->nullable()->constrained();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('relief_resources');
    }
};
