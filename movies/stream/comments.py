from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import comments

@api_view(["GET", "POST"])
def comments_view(request):
    

    if request.method == 'GET':
        identifier = request.GET.get('identifier', '').strip(' "\'')
        print("==================================>", identifier)
        

        if identifier:
            filtered_comments = comments.objects.filter(movie_id=identifier)
        else:
            filtered_comments = comments.objects.all()
            

        PAGE_SIZE = 5
        try:
            page = int(request.GET.get('page', 1))
            if page < 1: 
                page = 1
        except ValueError:
            page = 1
            

        start = (page - 1) * PAGE_SIZE
        end = start + PAGE_SIZE
        
        total_comments = filtered_comments.count()
        paginated_comments = filtered_comments[start:end]
        
        comments_list = []
        for comment in paginated_comments:
            comments_list.append({
                "comment_id": comment.comment_id,
                "movie_id": comment.movie_id,
                "comments": comment.comments,
                "user_name": comment.user_name,
                "created_at" : comment.created_at
            })
            
        return Response({
            "total_items": total_comments,
            "current_page": page,
            "page_size": PAGE_SIZE,
            "results": comments_list
        }, status=200)
        
    # --- POST METHOD ---
    if request.method == 'POST':
        data = request.data
        
        required_fields = ['movie_id', 'comments', 'user_name']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return Response({"you are missing fields": missing_fields}, status=400)
            
        try:
            new_comment = comments.objects.create(
                movie_id=data['movie_id'],
                comments=data['comments'],
                user_name=data['user_name']
            )
            
            return Response({
                "comment_id": new_comment.comment_id,
                "movie_id": new_comment.movie_id,
                "comments": new_comment.comments,
                "user_name": new_comment.user_name
            }, status=201)
            
        except Exception as e:
            return Response({"error": str(e)}, status=500)