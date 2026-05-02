# Connector Refactor

## 1. Task Dispatch

### Overview

ini adalah logic untuk menerima task dari external via websocket (connector). saat ini logic tersebut terbagi menjadi trigger task dan schedule task. aku ingin menyatukan 2 handler tersebut menjadi satu event "task-dispatch".

### Data

event "task-dispatch" dari server punya payload berikut:
```typescript
export interface DispatchTaskData {
  taskId: string;
  module: string;
  executeAt?: string;
  payload: any;
}
```

### How It Works

#### taskId

taskId dari event ini yang akan dijadikan id dari task yang akan dikerjakan, tujuannya agar sinkron antara task di app ini dan diserver. nantinya akan dipakai untuk mengirim status ke server apakah task id yang dikerjakan ini berhasil atau gagal.

#### module

module ini adalah nama module yang akan mengerjakan task, connector akan mencari module instance sesuai module yang dikirim dari dispatch-task dan bind/ memilih module instance tersebut sebagai module instance yang menjalankan task dengan memasukkann datanya ke queue.

#### executeAt

ini yang akan memisahkan antara task yang langsung dikerjakan atau dijadwalkan. jika executeAt ada maka task akan dijadwalkan, jika tidak ada maka task akan langsung dikerjakan.

#### payload

untuk payload sudah jelas bahwa ini akan jadi arguments dari fungsi di module instance yang akan mengerjakan task.


### Exception

ketika connector menerima task-dispatch dari server, dia akan mencari module instance yang tersedia sesuai data module, jika tidak ada module instance ditemukan maka emit event "task-reject" dengan data sebagai berikut:
```typescript
interface RejectTask {
  taskId: string;
  message: string; // Module instance not found
}
```

## 2. Send Task Process Status

### Overview

logic untuk mengirim status pengerjaan task dari module instance ke server. setelah module instance selesai mengerjakan task maka outputnya ada 2, antara succes dan failed. status succes atau failed ini perlu di kirim ke server via websocket (connector).

### Emit

setelah task diselesaikan oleh module instance, maka kirim status dengan emit ke event "task-done" dengan payload sebagai berikut:
```typescript
export interface TaskDoneData {
  taskId: string;
  status: 'COMPLETED' | 'FAILED';
  message?: string;
```

### Event Bus

gunakan event bus untuk menghubungkan module instance dengan connector. dan saat ini sudah dilakukan oleh task manager, task manager akan mengirim event bus saat task selesai dikerjakan, gunakan status itu untuk mengirim statusnya ke "task-done" di connector. di task manager ada 3 event ketika task selesai dikerjakan, timeout, completed, dan failed, sesuaikan dengan status yang akan dikirim ke "task-done" di connector. intinya server hanya perlu tahu apakah task ini berhasil atau gagal dengan message reason kenapa gagal.