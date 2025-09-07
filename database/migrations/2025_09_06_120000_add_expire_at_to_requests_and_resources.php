<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('relief_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('relief_requests', 'expire_at')) {
                $table->timestamp('expire_at')->nullable()->after('status');
            }
        });

        Schema::table('relief_resources', function (Blueprint $table) {
            if (! Schema::hasColumn('relief_resources', 'expire_at')) {
                $table->timestamp('expire_at')->nullable()->after('availability');
            }
        });
    }

    public function down()
    {
        Schema::table('relief_requests', function (Blueprint $table) {
            if (Schema::hasColumn('relief_requests', 'expire_at')) {
                $table->dropColumn('expire_at');
            }
        });

        Schema::table('relief_resources', function (Blueprint $table) {
            if (Schema::hasColumn('relief_resources', 'expire_at')) {
                $table->dropColumn('expire_at');
            }
        });
    }
};
