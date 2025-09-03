<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('relief_requests', function (Blueprint $table) {
            $table->id();
            $table->string('location')->nullable();
            $table->string('address')->nullable();
            $table->string('contact')->nullable();
            $table->string('priority')->nullable();
            $table->string('request_type')->nullable();
            $table->text('details')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->json('photos')->nullable();
            $table->string('videos')->nullable();
            $table->string('status')->default('pending');

            $table->foreignId('user_id')->nullable()->constrained();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('relief_requests');
    }
};
