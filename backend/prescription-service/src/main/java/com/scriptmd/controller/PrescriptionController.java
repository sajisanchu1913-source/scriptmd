package com.scriptmd.controller;

import com.scriptmd.model.Prescription;
import com.scriptmd.service.PrescriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// @RestController = this class handles HTTP requests and sends back JSON
// @RequestMapping = all routes start with /api/prescriptions
// @CrossOrigin    = allows Node.js (port 3000) to call Spring Boot (port 8080)
@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionController {

    // Spring automatically creates and injects the service
    @Autowired
    private PrescriptionService service;

    // ── ROUTE 1: Health Check ──
    // GET http://localhost:8080/api/prescriptions/health
    // First thing we test after starting Spring Boot
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Prescription service running!");
    }

    // ── ROUTE 2: Save Prescription ──
    // POST http://localhost:8080/api/prescriptions
    // Called by Node.js when doctor clicks Save
    // @RequestBody = take the JSON from Node.js and convert to Prescription object
    @PostMapping
    public ResponseEntity<Prescription> save(@RequestBody Prescription prescription) {
        try {
            Prescription saved = service.save(prescription);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ── ROUTE 3: Get All Prescriptions ──
    // GET http://localhost:8080/api/prescriptions
    // Called by React to load Recent Prescriptions card
    @GetMapping
    public ResponseEntity<List<Prescription>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // ── ROUTE 4: Get One Prescription ──
    // GET http://localhost:8080/api/prescriptions/1
    // {id} means it's dynamic — /1, /2, /3 etc
    @GetMapping("/{id}")
    public ResponseEntity<Prescription> getById(@PathVariable Long id) {
        Prescription p = service.getById(id);
        if (p == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(p);
    }

    // ── ROUTE 5: Get Prescriptions by Patient ID ──
    // GET http://localhost:8080/api/prescriptions/patient/1
    // Uses patientId — solves the duplicate name problem you spotted!
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Prescription>> getByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(service.getByPatientId(patientId));
    }

    // ── ROUTE 6: Download PDF ──
    // GET http://localhost:8080/api/prescriptions/1/pdf
    // Returns the prescription as a downloadable PDF file
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        try {
            Prescription p = service.getById(id);
            if (p == null) return ResponseEntity.notFound().build();

            byte[] pdf = service.generatePdf(p);

            // Tell the browser: this is a PDF file, download it
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData(
                "attachment",
                "prescription-" + id + ".pdf"
            );
            return ResponseEntity.ok().headers(headers).body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}