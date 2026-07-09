from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import comments

@api_view(["GET", "POST", "PATCH", "DELETE"])
def comments_view(request): # No comment_id in the argument anymore
    
    # --- GET METHOD ---
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

    # --- PATCH METHOD (ID in Body) ---
    if request.method == 'PATCH':
        data = request.data
        
        # Check if they provided the comment_id in the body
        if 'comment_id' not in data:
            return Response({"error": "Missing 'comment_id' in body"}, status=400)
            
        # Look up the comment using the ID from the body
        comment = get_object_or_404(comments, comment_id=data['comment_id'])
        
        if 'comments' in data:
            comment.comments = data['comments']
        if 'user_name' in data:
            comment.user_name = data['user_name']
            
        comment.save()
        
        return Response({
            "comment_id": comment.comment_id,
            "movie_id": comment.movie_id,
            "comments": comment.comments,
            "user_name": comment.user_name,
            "created_at": comment.created_at
        }, status=200)

    # --- DELETE METHOD (ID in Body) ---
    if request.method == 'DELETE':
        data = request.data
        
        # 1. Check if they provided the comment_id in the body
        if 'comment_id' not in data:
            return Response({"error": "Missing 'comment_id' in body"}, status=400)
            
        # 2. Look up the comment using the primary key (comment_id)
        # If it doesn't exist, this will automatically return a clean 404 error
        comment = get_object_or_404(comments, comment_id=data['comment_id'])
        
        # 3. Actually delete it from the database
        comment.delete()
        
        # 4. Return 200 OK so the user can actually see your success message
        return Response({
            "message": f"Comment {data['comment_id']} deleted successfully."
        }, status=200)