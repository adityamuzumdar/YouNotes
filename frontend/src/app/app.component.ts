import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'YouNotes';
  youtubeLink: string = '';
  notes: string = '';
  isLoading: boolean = false;
  error: string = '';

  constructor(private http: HttpClient) {}

  submit() {
    if (!this.youtubeLink) {
      this.error = 'Please enter a YouTube URL';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.notes = '';

    this.http.post('http://localhost:3000', { url: this.youtubeLink })
      .subscribe({
        next: (response: any) => {
          this.notes = response.notes;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to generate notes. Please try again.';
          this.isLoading = false;
          console.error('Error:', error);
        }
      });
  }
}
