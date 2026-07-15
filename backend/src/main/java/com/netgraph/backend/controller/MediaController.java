package com.netgraph.backend.controller;

import com.netgraph.backend.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
@Tag(name = "Media Uploads", description = "Endpoints for uploading images and files")
public class MediaController {

    private final StorageService storageService;

    public MediaController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload a media file", description = "Returns the public URL of the uploaded file")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        String filename = storageService.store(file);
        String publicUrl = "/media/" + filename;
        return ResponseEntity.ok(Map.of("url", publicUrl));
    }
}
