<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ReliefRequest;
use App\Models\ReliefResource;

class MarkExpired extends Command
{
    protected $signature = 'app:mark-expired';
    protected $description = 'Mark relief requests and resources as expired when their expire_at is in the past';

    public function handle()
    {
        $now = now();

        $requests = ReliefRequest::whereNotNull('expire_at')->where('expire_at', '<=', $now)->get();
        foreach ($requests as $r) {
            // if there is a status column, set it to 'expired'
            if (in_array('status', array_keys($r->getAttributes()))) {
                $r->status = 'expired';
                $r->save();
            }
        }

        $resources = ReliefResource::whereNotNull('expire_at')->where('expire_at', '<=', $now)->get();
        foreach ($resources as $res) {
            if (in_array('availability', array_keys($res->getAttributes()))) {
                $res->availability = 'unavailable';
                $res->save();
            }
        }

        $this->info('Marked '.count($requests).' requests and '.count($resources).' resources as expired/unavailable.');
        return 0;
    }
}
