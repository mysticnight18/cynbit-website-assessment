const menuButton=document.querySelector('.menu-toggle');
const navigation=document.querySelector('.main-nav');
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');navigation.classList.toggle('open',open)});
navigation?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menuButton?.setAttribute('aria-expanded','false');navigation.classList.remove('open')}));
document.querySelector('#year').textContent=new Date().getFullYear();
document.querySelectorAll('[data-interest]').forEach(link=>link.addEventListener('click',()=>{const select=document.querySelector('select[name="service"]');if(select)select.value=link.dataset.interest==='BitElevate internship'?'BitElevate internship':''}));
const form=document.querySelector('#inquiry-form');
form?.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const button=form.querySelector('button[type="submit"]'),status=document.querySelector('#form-status');
  button.disabled=true;button.textContent='Sending…';status.textContent='';status.classList.remove('error');
  const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;
  try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Your inquiry could not be sent. Please try again.');form.reset();status.textContent=result.message;}
  catch(error){status.textContent=error.message==='Failed to fetch'?'The server is unavailable right now. Please try again shortly.':error.message;status.classList.add('error');}
  finally{button.disabled=false;button.innerHTML='Send inquiry <span aria-hidden="true">↗</span>';}
});
