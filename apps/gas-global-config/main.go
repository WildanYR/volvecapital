package main

import (
	"log"
	"os"
	"sync"
	"sync/atomic"

	"github.com/goccy/go-json" // Library JSON lebih cepat dari encoding/json bawaan
	"github.com/gofiber/fiber/v2"
)

// --- Konfigurasi ---
const (
	AppPort   = ":3079"
	JSONFile  = "./data.json"
	AuthKey   = "AXPh527f8vqBucb7ev4ZyIke"
	HeaderKey = "X-API-Key"
)

// --- Global Variables ---
// Kita gunakan atomic.Value untuk performa thread-safe read yang ekstrem (lock-free read)
var globalData atomic.Value
var mu sync.Mutex // Mutex hanya untuk write ke file

func main() {
	// 1. Load Data Awal dari File ke Memory
	initialBytes, err := os.ReadFile(JSONFile)
	if err != nil {
		// Jika file tidak ada, inisialisasi dengan JSON kosong
		initialBytes = []byte("{}")
		os.WriteFile(JSONFile, initialBytes, 0644)
	}

	// Validasi JSON minimal
	if !json.Valid(initialBytes) {
		log.Fatal("File JSON corrupt saat startup")
	}

	// Simpan di RAM (Atomic)
	globalData.Store(initialBytes)

	// 2. Setup Fiber dengan Prefork (Opsional, tapi bagus untuk concurrency tinggi)
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
		// Optimasi JSON encoder menggunakan goccy/go-json (jauh lebih cepat)
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
	})

	// --- Endpoint Public: Get Data (Ultra Fast) ---
	app.Get("/", func(c *fiber.Ctx) error {
		// Ambil langsung dari RAM. Operasi ini butuh waktu nanosecond.
		data := globalData.Load().([]byte)

		c.Set("Content-Type", "application/json")
		return c.Send(data)
	})

	// --- Endpoint Protected: Update Data ---
	app.Post("/update", func(c *fiber.Ctx) error {
		apiKey := c.Get(HeaderKey)
		if apiKey != AuthKey {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
		}

		newData := c.Body()

		// Validasi JSON
		if !json.Valid(newData) {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON format"})
		}

		// Update File dan Memory
		mu.Lock()
		defer mu.Unlock()

		// 1. Tulis ke Disk (Persistence)
		if err := os.WriteFile(JSONFile, newData, 0644); err != nil {
			log.Printf("Error writing file: %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "Gagal update file"})
		}

		// 2. Update ke RAM (Atomic Replace)
		// Request berikutnya ke "/" akan langsung dapat data baru ini.
		globalData.Store(newData)

		return c.JSON(fiber.Map{
			"status":  "success",
			"message": "Data updated in Memory & Disk",
		})
	})

	log.Printf("Ultra-Fast Server running on port %s", AppPort)
	log.Fatal(app.Listen(AppPort))
}
