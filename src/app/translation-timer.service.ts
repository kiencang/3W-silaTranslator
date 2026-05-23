import {Injectable, signal, computed} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationTimerService {
  translationTime = signal(0);

  formattedTime = computed(() => {
    const timeInSeconds = this.translationTime();
    const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const s = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timerInterval: any;

  startTimer() {
    this.translationTime.set(0);
    this.timerInterval = setInterval(() => {
      this.translationTime.update(t => t + 1);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
